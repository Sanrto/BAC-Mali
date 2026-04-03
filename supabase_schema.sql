-- ================================================================
-- BAC MALI — SUPABASE SCHEMA COMPLET
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE PROFILES (liée à auth.users via trigger)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil lors d'un signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profils visibles par tous" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Utilisateur modifie son propre profil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ----------------------------------------------------------------
-- 2. TABLE FORUM_QUESTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  titre        TEXT NOT NULL CHECK (char_length(titre) <= 200),
  body         TEXT CHECK (char_length(body) <= 2000),
  categorie    TEXT NOT NULL DEFAULT 'Autre',
  answer_count INT NOT NULL DEFAULT 0,
  is_resolved  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_questions_categorie   ON public.forum_questions(categorie);
CREATE INDEX IF NOT EXISTS idx_questions_created_at  ON public.forum_questions(created_at DESC);

-- RLS questions
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions lisibles par tous" ON public.forum_questions
  FOR SELECT USING (true);

CREATE POLICY "Utilisateur connecté peut poster" ON public.forum_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auteur peut modifier sa question" ON public.forum_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Auteur peut supprimer sa question" ON public.forum_questions
  FOR DELETE USING (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 3. TABLE FORUM_ANSWERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body         TEXT NOT NULL CHECK (char_length(body) <= 3000),
  likes_count  INT NOT NULL DEFAULT 0,
  is_best      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.forum_answers(question_id);

-- RLS answers
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Réponses lisibles par tous" ON public.forum_answers
  FOR SELECT USING (true);

CREATE POLICY "Utilisateur connecté peut répondre" ON public.forum_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auteur peut modifier sa réponse" ON public.forum_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Auteur peut supprimer sa réponse" ON public.forum_answers
  FOR DELETE USING (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 4. TABLE FORUM_LIKES (un like par user par réponse)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id   UUID NOT NULL REFERENCES public.forum_answers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, user_id)
);

-- RLS likes
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes visibles par tous" ON public.forum_likes
  FOR SELECT USING (true);

CREATE POLICY "Utilisateur gère ses likes" ON public.forum_likes
  FOR ALL USING (auth.uid() = user_id);


-- ----------------------------------------------------------------
-- 5. FONCTIONS RPC (appelées depuis le client)
-- ----------------------------------------------------------------

-- Incrémente le compteur de réponses d'une question
CREATE OR REPLACE FUNCTION public.increment_answer_count(qid UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.forum_questions
  SET answer_count = answer_count + 1
  WHERE id = qid;
END;
$$;

-- Toggle like : ajoute ou retire un like, met à jour le compteur
CREATE OR REPLACE FUNCTION public.toggle_answer_like(aid UUID, uid UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  existing_like UUID;
BEGIN
  SELECT id INTO existing_like
  FROM public.forum_likes
  WHERE answer_id = aid AND user_id = uid;

  IF existing_like IS NULL THEN
    -- Ajouter le like
    INSERT INTO public.forum_likes (answer_id, user_id) VALUES (aid, uid);
    UPDATE public.forum_answers SET likes_count = likes_count + 1 WHERE id = aid;
  ELSE
    -- Retirer le like
    DELETE FROM public.forum_likes WHERE id = existing_like;
    UPDATE public.forum_answers SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = aid;
  END IF;
END;
$$;


-- ----------------------------------------------------------------
-- 6. TABLE CANDIDATS (EXISTANTE — NE PAS MODIFIER)
-- Rappel de la structure utilisée par le checker BAC :
-- numero_place, nom, prenoms, serie, mention, statut, centre, annee
-- ----------------------------------------------------------------
-- Cette table existe déjà dans votre projet. Ne pas la toucher.


-- ================================================================
-- VÉRIFICATION : exécutez cette requête pour tester
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- ================================================================


-- ----------------------------------------------------------------
-- 7. TABLES DE CONTENU (orientation, règles CENOU, procédures)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orientation (
  id                    BIGINT PRIMARY KEY,
  serie_bac             TEXT,
  etablissement         TEXT,
  structure             TEXT,
  filiere               TEXT,
  type_diplome          TEXT,
  conditions            TEXT,
  mode_acces            TEXT,
  age_max               INTEGER,
  duree                 TEXT,
  prerequis             TEXT,
  description           TEXT,
  debouches             TEXT,
  frais_inscription     NUMERIC,
  frais_candidature     NUMERIC,
  frais_carte_etudiant  NUMERIC,
  frais_pedagogiques    NUMERIC,
  autres_frais          TEXT,
  source_document       TEXT,
  source_pages          TEXT,
  source_note           TEXT
);
CREATE INDEX IF NOT EXISTS idx_orientation_serie_bac ON public.orientation(serie_bac);
CREATE INDEX IF NOT EXISTS idx_orientation_etablissement ON public.orientation(etablissement);
ALTER TABLE public.orientation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orientation lisible par tous" ON public.orientation;
CREATE POLICY "Orientation lisible par tous" ON public.orientation FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.cenou_rules (
  id               BIGINT PRIMARY KEY,
  categorie        TEXT,
  critere          TEXT,
  condition        TEXT,
  impact           TEXT,
  points           NUMERIC,
  source_document  TEXT
);
CREATE INDEX IF NOT EXISTS idx_cenou_rules_categorie ON public.cenou_rules(categorie);
CREATE INDEX IF NOT EXISTS idx_cenou_rules_critere ON public.cenou_rules(critere);
ALTER TABLE public.cenou_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Règles CENOU lisibles par tous" ON public.cenou_rules;
CREATE POLICY "Règles CENOU lisibles par tous" ON public.cenou_rules FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.procedures (
  id               BIGINT PRIMARY KEY,
  type             TEXT,
  canal            TEXT,
  titre            TEXT,
  etapes           TEXT,
  documents        TEXT,
  conditions       TEXT,
  resultat         TEXT,
  source_document  TEXT
);
CREATE INDEX IF NOT EXISTS idx_procedures_type ON public.procedures(type);
CREATE INDEX IF NOT EXISTS idx_procedures_canal ON public.procedures(canal);
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Procédures lisibles par tous" ON public.procedures;
CREATE POLICY "Procédures lisibles par tous" ON public.procedures FOR SELECT USING (true);
