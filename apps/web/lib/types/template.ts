export interface TemplatePreview {
  key: string;
  name: string;
  description: string;
  memberLevelCount: number;
  memberLevelNames: string[];
  serviceCategoryCount: number;
  serviceItemCount: number;
  serviceCategories: {
    name: string;
    itemCount: number;
    priceRange: { min: number; max: number };
  }[];
  rechargePlanCount: number;
  rechargePlans: string[];
}
