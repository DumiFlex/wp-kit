import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import BookmarkButton from "../BookmarkButton.vue";
import BundleMeta from "../BundleMeta.vue";
import KindChip from "../KindChip.vue";
import PostCard, { type PostCardData } from "../PostCard.vue";
import RatingBadge from "../RatingBadge.vue";
import StarButton from "../StarButton.vue";

const post: PostCardData = {
  slug: "dumi/warm-palette",
  kind: "module",
  subtype: "wildcard",
  stars: 1234,
  downloads: 56,
  updatedAt: new Date().toISOString(),
  tags: ["a", "b", "c", "d", "e", "f"],
};

describe("KindChip", () => {
  it("names the subtype, a bare module as fixed_values and a bundle as bundle", () => {
    expect(mount(KindChip, { props: { kind: "module", subtype: "combine" } }).attributes("data-type")).toBe("combine");
    expect(mount(KindChip, { props: { kind: "module" } }).text()).toBe("fixed_values");
    expect(mount(KindChip, { props: { kind: "bundle", subtype: "wildcard" } }).text()).toBe("bundle");
  });
});

describe("RatingBadge", () => {
  it("shows NSFW and Featured only when they apply", () => {
    expect(mount(RatingBadge, { props: { rating: "sfw" } }).text()).toBe("");
    const both = mount(RatingBadge, { props: { rating: "nsfw", featured: true } });
    expect(both.text()).toContain("NSFW");
    expect(both.text()).toContain("Featured");
  });
});

describe("BundleMeta", () => {
  it("counts modules in the singular and plural and lists the names", () => {
    expect(mount(BundleMeta, { props: { count: 1 } }).text()).toContain("1 module");
    const w = mount(BundleMeta, { props: { count: 2, names: ["x", "y"] } });
    expect(w.text()).toContain("2 modules");
    expect(w.text()).toContain("x");
    expect(w.text()).toContain("y");
  });
});

describe("PostCard", () => {
  it("is an <a> by default and passes href through", () => {
    const w = mount(PostCard, { props: { post }, attrs: { href: "/p/dumi/warm-palette" } });
    expect(w.element.tagName).toBe("A");
    expect(w.attributes("href")).toBe("/p/dumi/warm-palette");
    expect(w.attributes("data-type")).toBe("wildcard");
  });

  it("renders the given link component with its own props", () => {
    const Link = defineComponent({
      props: { to: { type: String, required: true } },
      setup(props, { slots }) {
        return () => h("a", { "data-to": props.to }, slots.default?.());
      },
    });
    const w = mount(PostCard, { props: { post, as: Link }, attrs: { to: "/p/x" } });
    expect(w.find("a").attributes("data-to")).toBe("/p/x");
  });

  it("shows four tags and a +N chip, the slug parts and the counts", () => {
    const w = mount(PostCard, { props: { post } });
    const tags = w.findAll(".wp-post-card__tags .wp-chip");
    expect(tags).toHaveLength(5);
    expect(tags[4]?.text()).toBe("+2");
    expect(w.find(".wp-post-card__owner").text()).toBe("dumi");
    expect(w.text()).toContain((1234).toLocaleString());
  });

  it("marks a deleted post and drops the version chip for it", () => {
    const w = mount(PostCard, { props: { post: { ...post, deleted: true, version: 4 } } });
    expect(w.attributes("data-deleted")).toBe("true");
    expect(w.text()).toContain("deleted");
    expect(w.text()).not.toContain("v4");
  });

  it("shows bundle contents only for a bundle", () => {
    const bundle = { ...post, kind: "bundle" as const, bundleModules: { count: 2, names: ["a", "b"] } };
    expect(mount(PostCard, { props: { post: bundle } }).findComponent(BundleMeta).exists()).toBe(true);
    expect(mount(PostCard, { props: { post: { ...post, bundleModules: bundle.bundleModules } } }).findComponent(BundleMeta).exists()).toBe(false);
  });
});

describe("StarButton and BookmarkButton", () => {
  it("show their state as pressed and emit toggle", async () => {
    const star = mount(StarButton, { props: { starred: true, count: 3 } });
    expect(star.attributes("aria-pressed")).toBe("true");
    expect(star.text()).toContain("Starred");
    await star.trigger("click");
    expect(star.emitted("toggle")).toHaveLength(1);

    const mark = mount(BookmarkButton, { props: { bookmarked: false } });
    expect(mark.attributes("aria-pressed")).toBe("false");
    await mark.trigger("click");
    expect(mark.emitted("toggle")).toHaveLength(1);
  });

  it("does not emit while disabled", async () => {
    const star = mount(StarButton, { props: { starred: false, disabled: true } });
    await star.trigger("click");
    expect(star.emitted("toggle")).toBeUndefined();
  });
});
