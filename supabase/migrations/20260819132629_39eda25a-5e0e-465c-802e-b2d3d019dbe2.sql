CREATE POLICY "fotos_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fotos_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fotos_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fotos_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);