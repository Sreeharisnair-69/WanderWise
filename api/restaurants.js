module.exports = async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "City is required" });
  const c = city.toLowerCase().trim();

  const restaurantData = {
    "london": [
      { name: "Dishoom", rating: 4.6, price: "££", url: "https://www.dishoom.com/", cuisine: "Indian", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800", reviewCount: 12450 },
      { name: "Flat Iron", rating: 4.5, price: "££", url: "https://flatironsteak.co.uk/", cuisine: "Steakhouse", image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800", reviewCount: 8450 },
      { name: "Padella", rating: 4.5, price: "£", url: "https://www.padella.co/", cuisine: "Italian", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800", reviewCount: 9650 }
    ],
    "paris": [
      { name: "Le Relais de l'Entrecôte", rating: 4.4, price: "€€", url: "https://www.relaisentrecote.fr/", cuisine: "French", image: "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800", reviewCount: 10320 },
      { name: "Septime", rating: 4.7, price: "€€€", url: "https://septime-charonne.fr/", cuisine: "Modern French", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 4210 }
    ],
    "tokyo": [
      { name: "Ichiran", rating: 4.5, price: "¥", url: "https://ichiran.com/", cuisine: "Ramen", image: "https://images.unsplash.com/photo-1557872943-16a5ac26437b?w=800", reviewCount: 16840 },
      { name: "Sukiyabashi Jiro", rating: 4.6, price: "¥¥¥", url: "https://www.sushi-jiro.jp/", cuisine: "Sushi", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", reviewCount: 3920 }
    ],
    "new york": [
      { name: "Katz's Delicatessen", rating: 4.6, price: "$", url: "https://katzsdelicatessen.com/", cuisine: "Deli", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", reviewCount: 20540 },
      { name: "Carbone", rating: 4.5, price: "$$$", url: "https://carbonenewyork.com/", cuisine: "Italian", image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800", reviewCount: 5120 }
    ],
    "dubai": [
      { name: "Al Ustad Special Kebab", rating: 4.5, price: "AED", url: "https://www.instagram.com/ustadspecialkabab/", cuisine: "Persian", image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800", reviewCount: 7430 },
      { name: "Zuma", rating: 4.6, price: "AED AED", url: "https://zumarestaurant.com/", cuisine: "Japanese", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800", reviewCount: 6520 }
    ]
  };

  if (restaurantData[c]) {
    return res.status(200).json({ data: restaurantData[c], meta: { count: restaurantData[c].length, source: "static_data" } });
  }

  return res.status(404).json({ error: "No restaurant data for this city" });
};


