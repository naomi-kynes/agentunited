import type { Metadata } from "next";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { importPage } from "nextra/pages";
import { getMDXComponents } from "@/mdx-components";

type DocsPageProps = {
  params: Promise<{
    mdxPath?: string[];
  }>;
};

const Wrapper = getMDXComponents().wrapper;

function getSegments(mdxPath?: string[]) {
  return ["docs", ...(mdxPath ?? [])];
}

export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), "content", "docs");
  const entries = await readdir(docsDir, { recursive: true, withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.parentPath ? path.join(entry.parentPath, entry.name) : entry.name)
    .filter((filePath) => /\.(md|mdx)$/.test(filePath))
    .filter((filePath) => !filePath.endsWith("/_meta.ts"))
    .map((filePath) => path.relative(docsDir, filePath))
    .map((filePath) => filePath.replace(/\.(md|mdx)$/, ""))
    .map((filePath) => ({
      mdxPath: filePath === "index" ? [] : filePath.split(path.sep),
    }));
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { mdxPath } = await params;
  const { metadata } = await importPage(getSegments(mdxPath));
  return metadata;
}

export default async function DocsPage(props: DocsPageProps) {
  const params = await props.params;
  const result = await importPage(getSegments(params.mdxPath));
  const { default: MDXContent, metadata, sourceCode, toc } = result;

  return (
    <Wrapper metadata={metadata} sourceCode={sourceCode} toc={toc}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
