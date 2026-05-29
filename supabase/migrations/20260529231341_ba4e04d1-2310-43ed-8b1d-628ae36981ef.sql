-- Extend document_type enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'medical_order';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'insurance_card';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'personal_doc';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'hospital_discharge';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vaccine';