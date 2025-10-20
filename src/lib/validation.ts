import { z } from 'zod';

// Patient validation schema
export const patientSchema = z.object({
  hospital_number: z.string()
    .min(6, 'Hospital number must be at least 6 characters')
    .max(12, 'Hospital number must be at most 12 characters')
    .regex(/^[A-Z0-9]+$/, 'Hospital number must contain only uppercase letters and numbers'),
  patient_number: z.string()
    .min(7, 'Patient number must be at least 7 characters')
    .max(12, 'Patient number must be at most 12 characters')
    .regex(/^P[0-9]+$/, 'Patient number must start with P followed by numbers'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  sex: z.enum(['Male', 'Female'], { required_error: 'Sex is required' }),
  date_of_birth: z.string(),
  age: z.number().int().min(0).max(150),
  height: z.number().min(0).max(300).nullable(),
  weight: z.number().min(0).max(500).nullable(),
  bmi: z.number().nullable(),
  contact_number: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .max(20, 'Contact number too long')
    .optional().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional(),
  history_present_illness: z.string().max(5000, 'History too long').optional(),
  problem_list: z.array(z.string()).nullable(),
  allergies: z.array(z.string()).nullable(),
  current_medications: z.array(z.string()).nullable(),
  admitting_diagnosis: z.string().max(500, 'Diagnosis too long').optional(),
});

// Vital signs validation
export const vitalSignsSchema = z.object({
  blood_pressure: z.string()
    .regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure format: XXX/XX')
    .optional().or(z.literal('')),
  heart_rate: z.number()
    .int()
    .min(30, 'Heart rate too low')
    .max(250, 'Heart rate too high')
    .nullable(),
  respiratory_rate: z.number()
    .int()
    .min(5, 'Respiratory rate too low')
    .max(60, 'Respiratory rate too high')
    .nullable(),
  oxygen_saturation: z.number()
    .min(0, 'O2 saturation must be between 0-100')
    .max(100, 'O2 saturation must be between 0-100')
    .nullable(),
  temperature: z.number()
    .min(35, 'Temperature too low (must be 35-42°C)')
    .max(42, 'Temperature too high (must be 35-42°C)')
    .nullable(),
  pain_scale: z.number()
    .int()
    .min(0, 'Pain scale must be 0-10')
    .max(10, 'Pain scale must be 0-10')
    .nullable(),
});

// Lab result validation
export const labResultSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  test_category: z.string()
    .min(1, 'Test category is required')
    .max(100, 'Test category too long'),
  test_name: z.string()
    .min(1, 'Test name is required')
    .max(100, 'Test name too long'),
  result_value: z.number()
    .finite('Result value must be a valid number'),
  normal_range: z.string()
    .regex(/^\d+\.?\d*-\d+\.?\d*$/, 'Normal range format: min-max')
    .max(50, 'Normal range too long'),
  unit: z.string()
    .max(50, 'Unit too long'),
  flag: z.enum(['High', 'Low', 'Normal']).nullable(),
  notes: z.string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional().or(z.literal('')),
});

// Imaging validation
export const imagingSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  category: z.enum(['X-ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'PET Scan', 'Fluoroscopy'], {
    required_error: 'Category is required'
  }),
  imaging_type: z.string()
    .min(1, 'Imaging type is required')
    .max(100, 'Imaging type too long'),
  findings: z.string()
    .max(5000, 'Findings must be at most 5000 characters')
    .optional().or(z.literal('')),
  notes: z.string()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional().or(z.literal('')),
  image_url: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL too long')
    .optional().or(z.literal('')),
});
