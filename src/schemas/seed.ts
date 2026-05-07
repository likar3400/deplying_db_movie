import * as storage from '../storage/entity.js'; 
import { CreateInput } from './entity.schema.js'; 

const seedData: CreateInput[] = [
  { 
    title: 'La La Land', 
    year: 2016, 
    genre: 'drama', 
    rating: 8.0,
    description: 'A jazz pianist and an aspiring actress fall in love while pursuing their dreams in Los Angeles.' 
  },
  { 
    title: 'Barbie', 
    year: 2023, 
    genre: 'comedy', 
    rating: 7.0,
    description: 'Barbie suffers a crisis that leads her to question her world and her existence.' 
  },
  { 
    title: 'Star Wars: The Phantom Menace', 
    year: 1999, 
    genre: 'sci-fi', 
    rating: 6.5,
    description: 'Two Jedi escape a hostile blockade and discover a young boy who may bring balance to the Force.' 
  },
  { 
    title: 'The Vampire Diaries', 
    year: 2009, 
    genre: 'horror', 
    rating: 7.7,
    description: 'The lives and loves of a teenage girl torn between two vampire brothers in a town full of secrets.' 
  }
];

export const seedMovies = () => {
  storage.reset(); 
  
  seedData.forEach(movie => {
    storage.create(movie);
  });
  
  console.log('Успішно додано фільми!');
};