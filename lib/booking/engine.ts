/**
 * Booking Engine - Core business logic for availability and collision detection
 * 
 * This module implements the deterministic booking validation rules from the PRD.
 * All booking operations must pass through these checks before committing.
 */

import { type Database } from './types';

export type BookingStatus = 'draft' | 'held' | 'pending_payment' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show' | 'reschedule_required';
export type BlockType = 'leave' | 'break' | 'maintenance' | 'closure' | 'manual_hold';

export interface AvailabilityCheck {
  isInstructorAvailable: boolean;
  isCustomerAvailable: boolean;
  areResourcesAvailable: boolean;
  isWithinBusinessHours: boolean;
  hasRequiredBuffers: boolean;
  conflicts: Conflict[];
  isValid: boolean;
}

export interface Conflict {
  type: 'instructor' | 'customer' | 'resource' | 'business_hours' | 'buffer';
  entityId: string;
  entityName: string;
  existingBookingId?: string;
  existingBookingNumber?: string;
  conflictTime: {
    start: string;
    end: string;
  };
  suggestedAlternatives?: Alternative[];
}

export interface Alternative {
  type: 'different_time' | 'different_instructor' | 'different_resource';
  description: string;
  data: any;
}

export interface BookingProposal {
  customerId: string;
  courseId: string;
  instructorId?: string;
  startTime: Date;
  endTime: Date;
  resourceIds?: string[];
  location?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  proposal: BookingProposal;
  availability: AvailabilityCheck;
  priceBreakdown: {
    basePrice: number;
    deposit: number;
    buffers: number;
    total: number;
  };
}

/**
 * Check if a booking slot is available
 * This is the core collision detection algorithm
 */
export async function checkAvailability(
  supabase: any, // Database client
  proposal: BookingProposal
): Promise<AvailabilityCheck> {
  const conflicts: Conflict[] = [];
  
  // Check instructor availability
  const instructorCheck = await checkInstructorAvailability(supabase, proposal);
  if (!instructorCheck.isAvailable) {
    conflicts.push(instructorCheck.conflict);
  }
  
  // Check customer availability
  const customerCheck = await checkCustomerAvailability(supabase, proposal);
  if (!customerCheck.isAvailable) {
    conflicts.push(customerCheck.conflict);
  }
  
  // Check resource availability
  const resourceCheck = await checkResourcesAvailability(supabase, proposal);
  if (!resourceCheck.areAllAvailable) {
    conflicts.push(...resourceCheck.conflicts);
  }
  
  // Check business hours
  const businessHoursCheck = await checkBusinessHours(supabase, proposal);
  if (!businessHoursCheck.isWithinHours) {
    conflicts.push(businessHoursCheck.conflict);
  }
  
  // Check buffers
  const bufferCheck = await checkBuffers(supabase, proposal);
  if (!bufferCheck.hasBuffers) {
    conflicts.push(bufferCheck.conflict);
  }
  
  return {
    isInstructorAvailable: instructorCheck.isAvailable,
    isCustomerAvailable: customerCheck.isAvailable,
    areResourcesAvailable: resourceCheck.areAllAvailable,
    isWithinBusinessHours: businessHoursCheck.isWithinHours,
    hasRequiredBuffers: bufferCheck.hasBuffers,
    conflicts,
    isValid: conflicts.length === 0
  };
}

/**
 * Check if instructor is available during the proposed time
 */
async function checkInstructorAvailability(
  supabase: any,
  proposal: BookingProposal
): Promise<{ isAvailable: boolean; conflict?: Conflict }> {
  if (!proposal.instructorId) {
    return { isAvailable: true }; // No instructor assigned yet
  }
  
  // Check for overlapping active bookings
  const { data: overlappingBookings, error } = await supabase
    .from('bookings')
    .select('id, booking_number, start_time, end_time, instructor_id')
    .eq('instructor_id', proposal.instructorId)
    .in('status', ['confirmed', 'checked_in', 'held', 'pending_payment'])
    .or(`
      and(start_time.lte.${proposal.endTime.toISOString()},end_time.gt.${proposal.startTime.toISOString()}),
      and(start_time.lt.${proposal.endTime.toISOString()},end_time.gte.${proposal.startTime.toISOString()}),
      and(start_time.lte.${proposal.startTime.toISOString()},end_time.gte.${proposal.endTime.toISOString()})
    `);
  
  if (error || (overlappingBookings && overlappingBookings.length > 0)) {
    const booking = overlappingBookings?.[0];
    return {
      isAvailable: false,
      conflict: {
        type: 'instructor',
        entityId: proposal.instructorId,
        entityName: 'Instructor',
        existingBookingId: booking?.id,
        existingBookingNumber: booking?.booking_number,
        conflictTime: {
          start: booking?.start_time || proposal.startTime.toISOString(),
          end: booking?.end_time || proposal.endTime.toISOString()
        }
      }
    };
  }
  
  // Check for availability blocks (leave, break, etc.)
  const { data: blocks, error: blocksError } = await supabase
    .from('availability_blocks')
    .select('id, block_type, reason, start_time, end_time')
    .eq('instructor_id', proposal.instructorId)
    .or(`
      and(start_time.lte.${proposal.endTime.toISOString()},end_time.gt.${proposal.startTime.toISOString()}),
      and(start_time.lt.${proposal.endTime.toISOString()},end_time.gte.${proposal.startTime.toISOString()})
    `);
  
  if (blocksError || (blocks && blocks.length > 0)) {
    const block = blocks?.[0];
    return {
      isAvailable: false,
      conflict: {
        type: 'instructor',
        entityId: proposal.instructorId,
        entityName: `Instructor (${block?.block_type})`,
        conflictTime: {
          start: block?.start_time || proposal.startTime.toISOString(),
          end: block?.end_time || proposal.endTime.toISOString()
        }
      }
    };
  }
  
  return { isAvailable: true };
}

/**
 * Check if customer is available during the proposed time
 */
async function checkCustomerAvailability(
  supabase: any,
  proposal: BookingProposal
): Promise<{ isAvailable: boolean; conflict?: Conflict }> {
  const { data: overlappingBookings, error } = await supabase
    .from('bookings')
    .select('id, booking_number, start_time, end_time, customer_id')
    .eq('customer_id', proposal.customerId)
    .in('status', ['confirmed', 'checked_in', 'held', 'pending_payment'])
    .or(`
      and(start_time.lte.${proposal.endTime.toISOString()},end_time.gt.${proposal.startTime.toISOString()}),
      and(start_time.lt.${proposal.endTime.toISOString()},end_time.gte.${proposal.startTime.toISOString()}),
      and(start_time.lte.${proposal.startTime.toISOString()},end_time.gte.${proposal.endTime.toISOString()})
    `);
  
  if (error || (overlappingBookings && overlappingBookings.length > 0)) {
    const booking = overlappingBookings?.[0];
    return {
      isAvailable: false,
      conflict: {
        type: 'customer',
        entityId: proposal.customerId,
        entityName: 'Customer',
        existingBookingId: booking?.id,
        existingBookingNumber: booking?.booking_number,
        conflictTime: {
          start: booking?.start_time || proposal.startTime.toISOString(),
          end: booking?.end_time || proposal.endTime.toISOString()
        }
      }
    };
  }
  
  return { isAvailable: true };
}

/**
 * Check if all required resources are available
 */
async function checkResourcesAvailability(
  supabase: any,
  proposal: BookingProposal
): Promise<{ areAllAvailable: boolean; conflicts: Conflict[] }> {
  const conflicts: Conflict[] = [];
  
  if (!proposal.resourceIds || proposal.resourceIds.length === 0) {
    return { areAllAvailable: true, conflicts };
  }
  
  for (const resourceId of proposal.resourceIds) {
    // Check booking_resources for overlapping bookings
    const { data: overlapping, error } = await supabase
      .from('booking_resources')
      .select('booking_id, bookings(id, booking_number, start_time, end_time, status)')
      .eq('resource_id', resourceId)
      .in('bookings.status', ['confirmed', 'checked_in', 'held', 'pending_payment'])
      .or(`
        and(bookings.start_time.lte.${proposal.endTime.toISOString()},bookings.end_time.gt.${proposal.startTime.toISOString()}),
        and(bookings.start_time.lt.${proposal.endTime.toISOString()},bookings.end_time.gte.${proposal.startTime.toISOString()})
      `);
    
    if (error || (overlapping && overlapping.length > 0)) {
      const booking = overlapping?.[0]?.bookings;
      conflicts.push({
        type: 'resource',
        entityId: resourceId,
        entityName: `Resource ${resourceId}`,
        existingBookingId: booking?.id,
        existingBookingNumber: booking?.booking_number,
        conflictTime: {
          start: booking?.start_time || proposal.startTime.toISOString(),
          end: booking?.end_time || proposal.endTime.toISOString()
        }
      });
    }
  }
  
  return {
    areAllAvailable: conflicts.length === 0,
    conflicts
  };
}

/**
 * Check if the proposed time is within business hours
 */
async function checkBusinessHours(
  supabase: any,
  proposal: BookingProposal
): Promise<{ isWithinHours: boolean; conflict?: Conflict }> {
  if (!proposal.instructorId) {
    return { isWithinHours: true }; // Can't check without instructor
  }
  
  // Get instructor's working hours
  const { data: instructor, error } = await supabase
    .from('instructors')
    .select('working_hours_start, working_hours_end, working_days')
    .eq('id', proposal.instructorId)
    .single();
  
  if (error || !instructor) {
    return { isWithinHours: true }; // Default to allowing if no instructor config
  }
  
  const startDate = new Date(proposal.startTime);
  const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startTime = startDate.toTimeString().slice(0, 5); // HH:MM
  const endDate = new Date(proposal.endTime);
  const endTime = endDate.toTimeString().slice(0, 5); // HH:MM
  
  // Check if it's a working day
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
  if (!instructor.working_days.includes(adjustedDay)) {
    return {
      isWithinHours: false,
      conflict: {
        type: 'business_hours',
        entityId: proposal.instructorId,
        entityName: 'Instructor (not a working day)',
        conflictTime: {
          start: proposal.startTime.toISOString(),
          end: proposal.endTime.toISOString()
        }
      }
    };
  }
  
  // Check if within working hours
  if (startTime < instructor.working_hours_start || endTime > instructor.working_hours_end) {
    return {
      isWithinHours: false,
      conflict: {
        type: 'business_hours',
        entityId: proposal.instructorId,
        entityName: 'Instructor (outside working hours)',
        conflictTime: {
          start: proposal.startTime.toISOString(),
          end: proposal.endTime.toISOString()
        }
      }
    };
  }
  
  return { isWithinHours: true };
}

/**
 * Check if required buffers are respected
 */
async function checkBuffers(
  supabase: any,
  proposal: BookingProposal
): Promise<{ hasBuffers: boolean; conflict?: Conflict }> {
  if (!proposal.courseId) {
    return { hasBuffers: true }; // Can't check without course
  }
  
  // Get course buffer requirements
  const { data: course, error } = await supabase
    .from('courses')
    .select('duration_minutes, setup_buffer_minutes, travel_buffer_minutes')
    .eq('id', proposal.courseId)
    .single();
  
  if (error || !course) {
    return { hasBuffers: true }; // Default to allowing if no course config
  }
  
  const totalBuffer = (course.setup_buffer_minutes || 0) + (course.travel_buffer_minutes || 0);
  const actualDuration = (proposal.endTime.getTime() - proposal.startTime.getTime()) / 1000 / 60; // minutes
  const requiredDuration = (course.duration_minutes || 0) + totalBuffer;
  
  if (actualDuration < requiredDuration) {
    return {
      hasBuffers: false,
      conflict: {
        type: 'buffer',
        entityId: proposal.courseId,
        entityName: `Course (needs ${requiredDuration} min, got ${actualDuration} min)`,
        conflictTime: {
          start: proposal.startTime.toISOString(),
          end: proposal.endTime.toISOString()
        }
      }
    };
  }
  
  return { hasBuffers: true };
}

/**
 * Calculate price breakdown for a booking
 */
export async function calculatePrice(
  supabase: any,
  proposal: BookingProposal
): Promise<{ basePrice: number; deposit: number; buffers: number; total: number }> {
  if (!proposal.courseId) {
    return { basePrice: 0, deposit: 0, buffers: 0, total: 0 };
  }
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('price_cents, deposit_cents')
    .eq('id', proposal.courseId)
    .single();
  
  if (error || !course) {
    return { basePrice: 0, deposit: 0, buffers: 0, total: 0 };
  }
  
  return {
    basePrice: course.price_cents,
    deposit: course.deposit_cents,
    buffers: 0, // Could add buffer charges if needed
    total: course.price_cents
  };
}

/**
 * Validate a complete booking proposal
 */
export async function validateBookingProposal(
  supabase: any,
  proposal: BookingProposal
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!proposal.customerId) errors.push('Customer is required');
  if (!proposal.courseId) errors.push('Course is required');
  if (!proposal.startTime) errors.push('Start time is required');
  if (!proposal.endTime) errors.push('End time is required');
  if (proposal.endTime <= proposal.startTime) errors.push('End time must be after start time');
  
  // Check availability
  const availability = await checkAvailability(supabase, proposal);
  if (!availability.isValid) {
    availability.conflicts.forEach(conflict => {
      errors.push(`${conflict.type}: ${conflict.entityName} is not available`);
    });
  }
  
  // Calculate price
  const priceBreakdown = await calculatePrice(supabase, proposal);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    proposal,
    availability,
    priceBreakdown
  };
}
