import type { CollectionConfig } from "payload";
import {
  isAdmin,
  isAdminOrAgent,
  publishedOrLoggedIn,
  updateDraftsForAgent,
  forceAgentDraft,
} from "../access";
import { slugField } from "../fields/slug";
import { revalidateEntryChange, revalidateEntryDelete } from "../hooks/revalidate";

export const PortfolioEntries: CollectionConfig = {
  slug: "portfolio-entries",
  labels: { singular: "Portfolio Entry", plural: "Portfolio Entries" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "entryType", "featured", "priorityScore", "_status"],
  },
  versions: { drafts: true },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrAgent,
    update: updateDraftsForAgent,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [forceAgentDraft],
    afterChange: [revalidateEntryChange],
    afterDelete: [revalidateEntryDelete],
  },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    slugField("title"),
    {
      name: "entryType",
      type: "select",
      required: true,
      defaultValue: "project",
      options: [
        { label: "Project", value: "project" },
        { label: "Work experience", value: "work_experience" },
        { label: "Education", value: "education" },
        { label: "Other", value: "other" },
      ],
    },
    { name: "summary", type: "textarea", maxLength: 300, localized: true },
    { name: "body", type: "richText", localized: true },
    { name: "role", type: "text", localized: true },
    { name: "organization", type: "text", localized: true },
    { name: "startDate", type: "date" },
    { name: "endDate", type: "date" },
    { name: "isOngoing", type: "checkbox", defaultValue: false },
    { name: "techStack", type: "text", hasMany: true },
    {
      name: "links",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
        {
          name: "kind",
          type: "select",
          defaultValue: "other",
          options: [
            { label: "GitHub", value: "github" },
            { label: "Demo", value: "demo" },
            { label: "Docs", value: "docs" },
            { label: "Other", value: "other" },
          ],
        },
      ],
    },
    { name: "coverImage", type: "upload", relationTo: "media" },
    {
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: {
        description:
          "Drag to reorder — this is the order images appear in the Gallery / Visual Showcase.",
      },
    },
    {
      name: "galleryOrder",
      type: "number",
      admin: {
        position: "sidebar",
        description:
          "Position of this entry's images in the Gallery. 1 = first. Empty = after all numbered entries.",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "priorityScore",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    {
      name: "externalId",
      type: "text",
      unique: true,
      index: true,
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "curation",
      type: "group",
      // Private: AI audit fields (rationale, rubric scores, source). Only readable
      // by logged-in admins — never exposed on the public REST API / portfolio pages.
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description: "Set by the Phase 3 AI agent; leave defaults for manual entries.",
      },
      fields: [
        {
          name: "source",
          type: "select",
          defaultValue: "manual",
          options: [
            { label: "Manual", value: "manual" },
            { label: "AI", value: "ai" },
          ],
        },
        {
          name: "status",
          type: "select",
          defaultValue: "draft",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ],
        },
        { name: "sourceRepo", type: "text" },
        { name: "aiRationale", type: "textarea" },
        { name: "rubricScores", type: "json" },
        { name: "curatedAt", type: "date" },
        {
          name: "ownerFeedback",
          type: "textarea",
          admin: {
            description:
              "Catatan untuk AI tentang entri INI — fakta yang salah, atau konteks " +
              "yang tak terlihat dari repo (mis. \"ini proyek klien asli, bukan latihan\"). " +
              "Dibaca setiap scan dan tidak pernah ditimpa AI. Aturan yang berlaku ke " +
              "semua entri ditulis di global Catatan Kurasi Portfolio.",
          },
        },
      ],
    },
  ],
};
