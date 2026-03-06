import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";
import type { MDXComponents } from "nextra/mdx-components";
import { ApiPlayground } from "@/components/api-playground";

export function getMDXComponents(components: MDXComponents = {}) {
  return getDocsMDXComponents({
    ApiPlayground,
    ...components,
  });
}

export const useMDXComponents = getMDXComponents;
