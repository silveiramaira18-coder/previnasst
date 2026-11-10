<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Presence lists save their header and participant changes atomically through a SECURITY INVOKER database function; unchanged participant IDs retain collected signatures.
- Company logos use a separate profile field and private photo storage, never the personal avatar; exports resolve a signed image for the list's owner.
- Presence calculation/export rules live in a pure module with executable tests; PDF/print and signature capture run only in browser event handlers or effects.
- Tenant identity comes from protected company memberships and server-stored active company context; never infer membership from names or editable profile fields.
- Tenant RLS and relationship triggers govern every operational table and private asset; preserve author-only mutations and global administrator access.
- Company selection and invitation acceptance reload the document to discard previous tenant caches and form state; offline photos must retain their originating user and company.
