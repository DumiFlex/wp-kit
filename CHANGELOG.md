# Changelog

## [0.4.0](https://github.com/DumiFlex/wp-kit/compare/v0.3.0...v0.4.0) (2026-11-02)


### ⚠ BREAKING CHANGES

* ChipToggle.vue is gone. <ChipToggle :pressed="x" …> is <Chip :pressed="x" size="sm" …> (size="md" for ChipToggle's md).
* KindChip.vue and RatingBadge.vue are gone. Use <Chip :color="kindColour(itemType(kind, subtype))">, <Chip tone="danger">NSFW</Chip> and <Chip tone="warn" icon="star-fill">Featured</Chip>; KindChipSubtype is ModuleSubtype.

### Features

* add the --wp-brand-discord token ([#33](https://github.com/DumiFlex/wp-kit/issues/33)) ([c045b1e](https://github.com/DumiFlex/wp-kit/commit/c045b1e3124c45742837ea6b64c294bfd9a6e4e3))
* lists and popovers opened from a Popover count as inside it ([#34](https://github.com/DumiFlex/wp-kit/issues/34)) ([b16f407](https://github.com/DumiFlex/wp-kit/commit/b16f407ca44929d46567914f042ea0544f4b6269))


### Bug Fixes

* **loading-mark:** keep the mark sharp and still as it starts to move ([#36](https://github.com/DumiFlex/wp-kit/issues/36)) ([2823c9c](https://github.com/DumiFlex/wp-kit/commit/2823c9c9110606d6422918abec00d09dbbc74bcd))
* show the focus ring on nine pieces ([#37](https://github.com/DumiFlex/wp-kit/issues/37)) ([6908b6d](https://github.com/DumiFlex/wp-kit/commit/6908b6d39d40044b3dd0f836a53c6c05eb4585e2))


### Refactoring

* drop KindChip and RatingBadge, use Chip ([#35](https://github.com/DumiFlex/wp-kit/issues/35)) ([b31b440](https://github.com/DumiFlex/wp-kit/commit/b31b440758e2b6ab4a956014827635e8a61cdbf0))
* fold ChipToggle into Chip ([#38](https://github.com/DumiFlex/wp-kit/issues/38)) ([b440a05](https://github.com/DumiFlex/wp-kit/commit/b440a05b2521a87af80d6f2ddea85f9bbe30732d))
* one field box for every field ([#39](https://github.com/DumiFlex/wp-kit/issues/39)) ([709be6f](https://github.com/DumiFlex/wp-kit/commit/709be6f8708481d015b5703e288fbfd974c99b0f))

## [0.3.0](https://github.com/DumiFlex/wp-kit/compare/v0.2.1...v0.3.0) (2026-11-02)


### Features

* publish the kit to npm as @dumiflex/wp-kit ([#25](https://github.com/DumiFlex/wp-kit/issues/25)) ([2ee813c](https://github.com/DumiFlex/wp-kit/commit/2ee813c622ed0c2a66063bf451ad2c2773a126ca))

## [0.2.1](https://github.com/DumiFlex/wp-kit/compare/v0.2.0...v0.2.1) (2026-11-02)


### Bug Fixes

* pass the extension's lint in the new pieces' tests and ContextMenu ([#22](https://github.com/DumiFlex/wp-kit/issues/22)) ([5da1520](https://github.com/DumiFlex/wp-kit/commit/5da15209ab77db4e70975a7cd380ba4359ac9aeb))
* **site:** let the page scroll and give it room ([#23](https://github.com/DumiFlex/wp-kit/issues/23)) ([66e9313](https://github.com/DumiFlex/wp-kit/commit/66e9313849658015cf347922e136c89758e0908e))

## [0.2.0](https://github.com/DumiFlex/wp-kit/compare/v0.1.0...v0.2.0) (2026-11-02)


### Features

* a pressable Chip (as=button or a link) ([#16](https://github.com/DumiFlex/wp-kit/issues/16)) ([736d17f](https://github.com/DumiFlex/wp-kit/commit/736d17f3337663b0cf6a3fc34ad6e714b6ba59cc))
* add ChipToggle ([#13](https://github.com/DumiFlex/wp-kit/issues/13)) ([ec80d22](https://github.com/DumiFlex/wp-kit/commit/ec80d22a2dc1db8c0596fe0cf96a8b50390e2a3b))
* add ListRow and a flush Disclosure ([#14](https://github.com/DumiFlex/wp-kit/issues/14)) ([ffcd818](https://github.com/DumiFlex/wp-kit/commit/ffcd818bc1e2c752d6f46a42c6c21dc7fdee9f55))
* add the community post pieces ([#10](https://github.com/DumiFlex/wp-kit/issues/10)) ([f2c5d11](https://github.com/DumiFlex/wp-kit/commit/f2c5d11e904b13cc2c8cb8890217c8111867f1b4))
* checkable menu items and a swatch RadioGroup ([#18](https://github.com/DumiFlex/wp-kit/issues/18)) ([fb12882](https://github.com/DumiFlex/wp-kit/commit/fb128824d68cf5be306665b8bdaa701505d40296))
* ConfirmModal gates, and a community brand for Logo and LoadingMark ([#15](https://github.com/DumiFlex/wp-kit/issues/15)) ([a543bb4](https://github.com/DumiFlex/wp-kit/commit/a543bb48167ecd698a22e71457900911c3064a54))
* on-accent / on-media / scrim tokens, shared colour presets, a ModalShell label and DragHandle ([#17](https://github.com/DumiFlex/wp-kit/issues/17)) ([a726c69](https://github.com/DumiFlex/wp-kit/commit/a726c69135c08f5f3c65dd2b17286553d2131585))


### Bug Fixes

* let the page space PostCards ([#12](https://github.com/DumiFlex/wp-kit/issues/12)) ([7f6682c](https://github.com/DumiFlex/wp-kit/commit/7f6682c10e887ad213f7670769714d7a383a1d54))
* PostCard as a button, and in every look ([#11](https://github.com/DumiFlex/wp-kit/issues/11)) ([a830c1d](https://github.com/DumiFlex/wp-kit/commit/a830c1da4916a807b1939cb658d0404d562813a5))

## 0.1.0 (2026-10-29)


### Features

* add SupportLinks and accept PrimeIcons 8 ([#4](https://github.com/DumiFlex/wp-kit/issues/4)) ([10f4048](https://github.com/DumiFlex/wp-kit/commit/10f4048a14d19d2eb11242d0ca9bb186dd8ba4aa))
* add the Community palette (rust accent, warm cream light) ([#6](https://github.com/DumiFlex/wp-kit/issues/6)) ([fea4956](https://github.com/DumiFlex/wp-kit/commit/fea4956b181ddd5a4a7d2da146ff50b49d8ea627))
* add the shared component kit ([#1](https://github.com/DumiFlex/wp-kit/issues/1)) ([67ad60d](https://github.com/DumiFlex/wp-kit/commit/67ad60dd8857eeec49f4ff09f149bbab4cc21e22))
* add the showcase site ([#3](https://github.com/DumiFlex/wp-kit/issues/3)) ([04adde4](https://github.com/DumiFlex/wp-kit/commit/04adde40cfe6ee48810e2b1f03382415899876e2))
* add the theme and the manager controls ([#2](https://github.com/DumiFlex/wp-kit/issues/2)) ([f3841a3](https://github.com/DumiFlex/wp-kit/commit/f3841a344deba5f9576dc7e72d3d48294d2e3b1f))


### Bug Fixes

* type-check under exactOptionalPropertyTypes ([#5](https://github.com/DumiFlex/wp-kit/issues/5)) ([e43fd47](https://github.com/DumiFlex/wp-kit/commit/e43fd477a2080991298bfa2d6f568ed70c319bf6))
