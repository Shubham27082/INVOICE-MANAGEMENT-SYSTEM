const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Item Schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  variants: { type: String },
  price: { type: Number, required: true }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

// Sample HealthyChef Items
const sampleItems = [
  {
    name: 'Quinoa Power Bowl',
    description: 'Nutritious quinoa with roasted vegetables, chickpeas, and tahini dressing',
    variants: 'Regular, Large',
    price: 299
  },
  {
    name: 'Grilled Chicken Salad',
    description: 'Fresh greens with grilled chicken breast, cherry tomatoes, and balsamic vinaigrette',
    variants: 'Regular, Large',
    price: 349
  },
  {
    name: 'Avocado Toast Special',
    description: 'Whole grain toast topped with smashed avocado, poached egg, and microgreens',
    variants: 'Single, Double',
    price: 249
  },
  {
    name: 'Green Detox Smoothie',
    description: 'Spinach, banana, mango, chia seeds, and almond milk blend',
    variants: 'Regular, Large',
    price: 149
  },
  {
    name: 'Protein Power Wrap',
    description: 'Whole wheat wrap with grilled chicken, hummus, lettuce, and veggies',
    variants: 'Chicken, Paneer, Tofu',
    price: 279
  },
  {
    name: 'Buddha Bowl',
    description: 'Brown rice, roasted sweet potato, edamame, avocado, and sesame dressing',
    variants: 'Vegan, With Chicken',
    price: 329
  },
  {
    name: 'Fresh Fruit Parfait',
    description: 'Greek yogurt layered with seasonal fruits, granola, and honey',
    variants: 'Regular, Large',
    price: 199
  },
  {
    name: 'Zucchini Noodle Bowl',
    description: 'Spiralized zucchini with marinara sauce, cherry tomatoes, and basil',
    variants: 'Vegan, With Grilled Chicken',
    price: 269
  },
  {
    name: 'Acai Energy Bowl',
    description: 'Acai puree topped with granola, fresh berries, banana, and coconut',
    variants: 'Regular, Large',
    price: 319
  },
  {
    name: 'Immunity Booster Juice',
    description: 'Orange, carrot, ginger, and turmeric fresh pressed juice',
    variants: 'Regular, Large',
    price: 129
  }
];

// Seed function
async function seedItems() {
  try {
    // Clear existing items (optional - comment out if you want to keep existing items)
    // await Item.deleteMany({});
    // console.log('Existing items cleared');

    // Insert sample items
    const result = await Item.insertMany(sampleItems);
    console.log(`✅ Successfully added ${result.length} items to the database!`);
    
    console.log('\nAdded items:');
    result.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - Rs. ${item.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding items:', error);
    process.exit(1);
  }
}

// Run the seed function
seedItems();
