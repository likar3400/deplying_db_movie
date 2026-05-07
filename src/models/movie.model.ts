import mongoose, { Schema } from 'mongoose';
    export interface IMovie{
        title:string;
        description:string;
        year:number;
       genre: 'action' | 'comedy' | 'drama' | 'horror' | 'sci-fi' | 'thriller' | 'documentary';
  rating?: number;
    }
    const movieSchema = new Schema<IMovie>({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  year: { 
    type: Number, 
    required: true,
    validate: {
      validator: (v: number) => v <= new Date().getFullYear(),
      message: 'Year cannot be in the future!'
    }
  },
  genre: { 
    type: String, 
    enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'thriller', 'documentary'],
    required: true 
  },
  rating: { type: Number, min: 0, max: 10, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});
movieSchema.virtual('shortInfo').get(function() {
  return `${this.title} (${this.year})`;
});

export const MovieModel = mongoose.models['Movie'] || mongoose.model<IMovie>('Movie', movieSchema);