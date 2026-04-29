import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '../../stores/cartStore';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  dietary_tags: string[];
  category_id: string | null;
};

type Category = { id: string; name: string };

type Props = { items: MenuItem[]; categories: Category[] };

export default function MenuGrid({ items, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { add } = useCart();

  const filtered = activeCategory
    ? items.filter(i => i.category_id === activeCategory)
    : items;

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          size="sm"
          variant={activeCategory === null ? 'default' : 'outline'}
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            size="sm"
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(item => (
          <Card key={item.id} className="overflow-hidden">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" />
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.name}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold">${(item.price_cents / 100).toFixed(2)}</span>
                  <div className="flex gap-1 mt-1">
                    {item.dietary_tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => add({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url ?? undefined })}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
