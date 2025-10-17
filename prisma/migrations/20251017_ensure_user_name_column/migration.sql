-- Ensure User.name column exists (it should from 0001_init, but this is a safety check)
DO $$ 
BEGIN
    -- Add the name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "name" TEXT;
    END IF;
END $$;
