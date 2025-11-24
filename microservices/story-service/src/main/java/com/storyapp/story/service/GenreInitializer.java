package com.storyapp.story.service;

import com.storyapp.story.model.Genre;
import com.storyapp.story.repository.GenreRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

@Component
public class GenreInitializer implements CommandLineRunner {

    private final GenreRepository genreRepository;

    public GenreInitializer(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (genreRepository.count() == 0) {
            List<Genre> genres = Arrays.asList(
                new Genre("Action", "Fast-paced stories with exciting action sequences"),
                new Genre("Adventure", "Journeys and exploration with excitement"),
                new Genre("Comedy", "Humorous and funny stories"),
                new Genre("Drama", "Serious narrative with emotional themes"),
                new Genre("Fantasy", "Magical and imaginative worlds"),
                new Genre("Horror", "Scary and suspenseful stories"),
                new Genre("Mystery", "Puzzle-solving and detective stories"),
                new Genre("Romance", "Love stories and relationships"),
                new Genre("Sci-Fi", "Science fiction and futuristic themes"),
                new Genre("Thriller", "Suspenseful and intense stories"),
                new Genre("Historical", "Stories set in the past"),
                new Genre("Biography", "Real-life stories of individuals"),
                new Genre("Crime", "Stories involving criminal activities"),
                new Genre("War", "Military conflicts and battles"),
                new Genre("Western", "Stories set in the American Old West"),
                new Genre("Animation", "Animated stories and characters"),
                new Genre("Documentary", "Factual and informative stories"),
                new Genre("Musical", "Stories with song and dance"),
                new Genre("Superhero", "Heroes with extraordinary powers"),
                new Genre("Supernatural", "Stories with paranormal elements")
            );
            genreRepository.saveAll(genres);
            System.out.println("Initialized " + genres.size() + " genres");
        }
    }
}
