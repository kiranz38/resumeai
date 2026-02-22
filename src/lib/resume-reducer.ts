/**
 * useReducer actions and reducer for building a DocResume from scratch.
 */

import type {
  DocResume,
  DocExperience,
  DocEducation,
  DocSkillGroup,
  DocProject,
} from "./pro-document";

// ── Action types ──

export type ResumeAction =
  | { type: "SET_FULL"; resume: DocResume }
  | { type: "SET_CONTACT"; field: keyof Pick<DocResume, "name" | "headline" | "email" | "phone" | "location">; value: string }
  | { type: "SET_LINKS"; links: string[] }
  | { type: "SET_PHOTO"; photoUrl: string | undefined }
  | { type: "SET_SUMMARY"; summary: string }
  // Experience
  | { type: "ADD_EXPERIENCE" }
  | { type: "UPDATE_EXPERIENCE"; index: number; exp: DocExperience }
  | { type: "REMOVE_EXPERIENCE"; index: number }
  | { type: "REORDER_EXPERIENCE"; from: number; to: number }
  // Education
  | { type: "ADD_EDUCATION" }
  | { type: "UPDATE_EDUCATION"; index: number; edu: DocEducation }
  | { type: "REMOVE_EDUCATION"; index: number }
  // Skills
  | { type: "ADD_SKILL_GROUP" }
  | { type: "UPDATE_SKILL_GROUP"; index: number; group: DocSkillGroup }
  | { type: "REMOVE_SKILL_GROUP"; index: number }
  // Projects
  | { type: "ADD_PROJECT" }
  | { type: "UPDATE_PROJECT"; index: number; project: DocProject }
  | { type: "REMOVE_PROJECT"; index: number }
  // Certifications
  | { type: "SET_CERTIFICATIONS"; certs: string[] };

// ── Empty defaults ──

export const EMPTY_EXPERIENCE: DocExperience = {
  company: "",
  title: "",
  location: "",
  start: "",
  end: "",
  bullets: [""],
};

export const EMPTY_EDUCATION: DocEducation = {
  school: "",
  degree: "",
  start: "",
  end: "",
};

export const EMPTY_SKILL_GROUP: DocSkillGroup = {
  label: "",
  items: [],
};

export const EMPTY_PROJECT: DocProject = {
  name: "",
  bullets: [""],
};

export const EMPTY_RESUME: DocResume = {
  name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  summary: "",
  skills: { groups: [] },
  experience: [],
  projects: [],
  education: [],
  certifications: [],
};

// ── Reducer ──

export function resumeReducer(state: DocResume, action: ResumeAction): DocResume {
  switch (action.type) {
    case "SET_FULL":
      return action.resume;

    case "SET_CONTACT":
      return { ...state, [action.field]: action.value };

    case "SET_LINKS":
      return { ...state, links: action.links };

    case "SET_PHOTO":
      return { ...state, photoUrl: action.photoUrl };

    case "SET_SUMMARY":
      return { ...state, summary: action.summary };

    // ── Experience ──
    case "ADD_EXPERIENCE":
      return { ...state, experience: [...state.experience, { ...EMPTY_EXPERIENCE }] };

    case "UPDATE_EXPERIENCE":
      return {
        ...state,
        experience: state.experience.map((e, i) =>
          i === action.index ? action.exp : e,
        ),
      };

    case "REMOVE_EXPERIENCE":
      return {
        ...state,
        experience: state.experience.filter((_, i) => i !== action.index),
      };

    case "REORDER_EXPERIENCE": {
      const exp = [...state.experience];
      const [moved] = exp.splice(action.from, 1);
      exp.splice(action.to, 0, moved);
      return { ...state, experience: exp };
    }

    // ── Education ──
    case "ADD_EDUCATION":
      return {
        ...state,
        education: [...(state.education || []), { ...EMPTY_EDUCATION }],
      };

    case "UPDATE_EDUCATION":
      return {
        ...state,
        education: (state.education || []).map((e, i) =>
          i === action.index ? action.edu : e,
        ),
      };

    case "REMOVE_EDUCATION":
      return {
        ...state,
        education: (state.education || []).filter((_, i) => i !== action.index),
      };

    // ── Skills ──
    case "ADD_SKILL_GROUP":
      return {
        ...state,
        skills: {
          groups: [...state.skills.groups, { ...EMPTY_SKILL_GROUP }],
        },
      };

    case "UPDATE_SKILL_GROUP":
      return {
        ...state,
        skills: {
          groups: state.skills.groups.map((g, i) =>
            i === action.index ? action.group : g,
          ),
        },
      };

    case "REMOVE_SKILL_GROUP":
      return {
        ...state,
        skills: {
          groups: state.skills.groups.filter((_, i) => i !== action.index),
        },
      };

    // ── Projects ──
    case "ADD_PROJECT":
      return {
        ...state,
        projects: [...(state.projects || []), { ...EMPTY_PROJECT }],
      };

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: (state.projects || []).map((p, i) =>
          i === action.index ? action.project : p,
        ),
      };

    case "REMOVE_PROJECT":
      return {
        ...state,
        projects: (state.projects || []).filter((_, i) => i !== action.index),
      };

    // ── Certifications ──
    case "SET_CERTIFICATIONS":
      return { ...state, certifications: action.certs };

    default:
      return state;
  }
}
