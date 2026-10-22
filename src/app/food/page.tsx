import { FoodLibrary } from '@/components/food/FoodLibrary';
import { foodCatalog } from '@/lib/food-catalog';

export default function FoodPage() {
  return <FoodLibrary catalog={foodCatalog} />;
}
