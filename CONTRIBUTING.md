## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/d1ceward/lipsum_generator. By contributing you agree to abide by the Code of Merit.

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your change
4. Run `pnpm check` (Biome and the tests both have to pass, CI runs the same)
5. Commit your changes (`git commit -am 'Add some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create a new Pull Request

### Ground rules

- Generation logic belongs in `generator.js` and stays pure, no DOM and no extension API, so it can be tested with `node --test`.
- Every new user-facing string goes through `_locales/`, in both `en` and `fr`, with the English text repeated inline in `popup.html` as the fallback. The test suite fails if any of the three drifts.
- Formatting is not a matter of taste here, `pnpm format` settles it.
- Bumping the version means editing both `manifest.json` and `package.json`; a test checks they agree.
- New runtime files must be added to the `FILES` list in `build`, otherwise they will not ship.
