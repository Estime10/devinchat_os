-- Alignement V1 : retirer avatar_url si la table existait déjà avec cette colonne.
-- Met à jour le trigger pour renseigner display_name depuis les metadata Auth.

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS avatar_url;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')), '')
  );
  RETURN NEW;
END;
$$;
