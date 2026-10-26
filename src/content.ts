export const base = import.meta.env.BASE_URL;
export const asset = (name: string) => `${base}mecha/${name}`;
export const links = {
  menu: 'https://www.mechanoodlebar.com/menu',
  locations: 'https://www.mechanoodlebar.com/locations',
  official: 'https://www.mechanoodlebar.com/',
  directions: 'https://www.google.com/maps/dir/?api=1&destination=Mecha+Noodle+Bar+1215+Post+Road+Fairfield+CT+06824',
  instagram: 'https://www.instagram.com/eatramen/',
  facebook: 'https://www.facebook.com/mechanoodlebar/',
};
export const disclaimer = 'This website was created for educational purposes only and does not represent or reflect the official website of the business.';
export const dishes = [
  {id: 'ramen', mood: 'Rich & comforting', category: 'RAMEN', title: 'Tonkotsu 3.0', description: 'Deep pork broth, springy noodles and generous toppings. Your next comfort-food ritual.', image: 'ramen.webp', alt: 'Mecha Tonkotsu ramen with egg, pork and corn on an orange table.', url: 'https://www.mechanoodlebar.com/tonkotsu-3', note: 'For the broth lover'},
  {id: 'pho', mood: 'Light & aromatic', category: 'PHO', title: 'Pho Tai', description: 'Beef, rice noodles and fragrant herbs. A bowl to settle into, one spoonful at a time.', image: 'pho.webp', alt: 'Mecha Pho Tai with beef, scallions and rice noodles in a white bowl.', url: 'https://www.mechanoodlebar.com/pho-tai', note: 'For the noodle purist'},
  {id: 'dumplings', mood: 'Something to share', category: 'MUNCHIES', title: 'Red Oil Dumplings', description: 'Pork and shrimp dumplings with Sichuan vinegar and cilantro. Start here with the table.', image: 'dumplings.webp', alt: 'Mecha red oil dumplings topped with herbs, with chopsticks above the bowl.', url: 'https://www.mechanoodlebar.com/red-oil-dumplings', note: 'For the whole crew'},
];
