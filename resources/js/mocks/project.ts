// Sumber data: resources/mocks/*.json, file yang sama dengan yang dikirim controller Laravel.
import projectJson from '../../mocks/project.json';
import statusJson from '../../mocks/project-status.json';
import type { Project, ProjectStatus } from '@/types/cliptalk';

export const project = projectJson as Project;
export const projectStatus = statusJson as ProjectStatus;
