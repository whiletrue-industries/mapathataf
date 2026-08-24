import { FilterKind } from './filter-defs';

export const CONCRETE_SECTIONS = ['education', 'health', 'community'] as const;
export type ConcreteSection = (typeof CONCRETE_SECTIONS)[number];
export type Section = 'all' | ConcreteSection;

export type SectionDef = {
  key: ConcreteSection;
  label: string;
  icon: string;
  // Sub-filters offered (in display order) while this section is selected.
  // גיל is offered for every section and is not listed here.
  filters: FilterKind[];
};

// Display order, right to left under RTL: מסגרות חינוך, התפתחות הילד, אחה״צ, then הכל.
export const SECTIONS: SectionDef[] = [
  {
    key: 'education',
    label: 'מסגרות חינוך',
    icon: 'icon-section-education.svg',
    filters: ['subsidy', 'licensing', 'mentoring'],
  },
  {
    key: 'health',
    label: 'התפתחות הילד',
    icon: 'icon-section-health.svg',
    filters: ['health_subkind'],
  },
  {
    key: 'community',
    label: 'אחה״צ',
    icon: 'icon-section-community.svg',
    filters: ['community_subkind'],
  },
];

export const ALL_SECTION_LABEL = 'הכל';

export function isConcreteSection(value: any): value is ConcreteSection {
  return (CONCRETE_SECTIONS as readonly string[]).includes(value);
}

export function sectionDef(key: ConcreteSection): SectionDef {
  return SECTIONS.find((s) => s.key === key)!;
}

export type SectionColors = { fill: string, border: string };

/**
 * The category palette as the browser has resolved it, read from the custom properties
 * defined in styles.less. Lets the map pins share one definition with the chips and badges
 * instead of repeating hex values that would quietly drift.
 */
export function sectionPalette(root: Element): Record<ConcreteSection, SectionColors> {
  const style = getComputedStyle(root);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return Object.fromEntries(CONCRETE_SECTIONS.map((key) => [key, {
    fill: read(`--fk-${key}`),
    border: read(`--fk-${key}-border`),
  }])) as Record<ConcreteSection, SectionColors>;
}
