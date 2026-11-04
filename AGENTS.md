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
