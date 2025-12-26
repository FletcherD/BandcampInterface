import type { Tag } from '../types/bandcamp';

interface TagListProps {
  tags: Tag[];
}

export default function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.norm_name}
          className="tag px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
