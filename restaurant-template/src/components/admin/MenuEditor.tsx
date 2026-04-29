import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { supabaseBrowser } from '../../lib/supabase/browser';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags: string[];
  image_url: string | null;
  category_id: string | null;
};

type Category = { id: string; name: string };

type Props = {
  initialItems: MenuItem[];
  categories: Category[];
};

export default function MenuEditor({ initialItems, categories }: Props) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);

  async function toggleAvailable(item: MenuItem) {
    const { data } = await supabaseBrowser
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
      .select()
      .single();
    if (data) setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: data.is_available } : i));
  }

  async function toggleFeatured(item: MenuItem) {
    const { data } = await supabaseBrowser
      .from('menu_items')
      .update({ is_featured: !item.is_featured })
      .eq('id', item.id)
      .select()
      .single();
    if (data) setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: data.is_featured } : i));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, itemId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `menu/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabaseBrowser.storage.from('menu-images').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabaseBrowser.storage.from('menu-images').getPublicUrl(path);
      await supabaseBrowser.from('menu_items').update({ image_url: publicUrl }).eq('id', itemId);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, image_url: publicUrl } : i));
    }
    setUploading(false);
  }

  async function saveEdit() {
    if (!editing) return;
    const { data } = await supabaseBrowser
      .from('menu_items')
      .update({
        name: editing.name,
        description: editing.description,
        price_cents: editing.price_cents,
        category_id: editing.category_id,
        dietary_tags: editing.dietary_tags,
      })
      .eq('id', editing.id)
      .select()
      .single();
    if (data) {
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...data } : i));
      setEditing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name}</div>
                  {item.dietary_tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.dietary_tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {categories.find(c => c.id === item.category_id)?.name ?? '—'}
                </td>
                <td className="px-4 py-3">${(item.price_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Badge variant={item.is_available ? 'default' : 'secondary'}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                    {item.is_featured && <Badge variant="outline">Featured</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleAvailable(item)}>
                      {item.is_available ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleFeatured(item)}>
                      {item.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <label className="cursor-pointer">
                      <Button size="sm" variant="ghost" asChild>
                        <span>{uploading ? 'Uploading…' : 'Image'}</span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e, item.id)}
                      />
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Price (cents)</Label>
                <Input type="number" value={editing.price_cents} onChange={e => setEditing({ ...editing, price_cents: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={editing.category_id ?? ''}
                  onChange={e => setEditing({ ...editing, category_id: e.target.value || null })}
                >
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
