package com.novahotel.config;

import java.io.InputStream;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.util.StdDateFormat;
import com.novahotel.model.Booking;
import com.novahotel.model.Review;
import com.novahotel.model.Room;
import com.novahotel.model.User;
import com.novahotel.repository.BookingRepository;
import com.novahotel.repository.ReviewRepository;
import com.novahotel.repository.RoomRepository;
import com.novahotel.repository.UserRepository;

/**
 * Seeds sample data on startup if collections are empty.
 * This ensures the app has data for demo without manual import every time.
 * JSON date fields must be plain ISO-8601 strings (e.g. "2026-03-05T14:00:00.000Z").
 */
@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    /** Shared ObjectMapper configured to parse ISO-8601 date strings. */
    private ObjectMapper buildMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.setDateFormat(new StdDateFormat().withColonInTimeZone(true));
        return mapper;
    }

    @Bean
    @Order(1)
    CommandLineRunner seedRooms(RoomRepository roomRepository) {
        return args -> {
            if (roomRepository.count() > 0) {
                log.info("Rooms collection already has data, skipping seed.");
                return;
            }
            seedCollection("sample-data/rooms.json", roomRepository,
                    new TypeReference<List<Room>>() {},
                    "rooms",
                    list -> list.forEach(r -> r.setId(null)));
        };
    }

    @Bean
    @Order(2)
    CommandLineRunner seedUsers(UserRepository userRepository) {
        return args -> {
            if (userRepository.count() > 0) {
                log.info("Users collection already has data, skipping seed.");
                return;
            }
            seedCollection("sample-data/users.json", userRepository,
                    new TypeReference<List<User>>() {},
                    "users",
                    list -> list.forEach(u -> u.setId(null)));
        };
    }

    @Bean
    @Order(3)
    CommandLineRunner seedBookings(BookingRepository bookingRepository) {
        return args -> {
            if (bookingRepository.count() > 0) {
                log.info("Bookings collection already has data, skipping seed.");
                return;
            }
            seedCollection("sample-data/bookings.json", bookingRepository,
                    new TypeReference<List<Booking>>() {},
                    "bookings",
                    list -> list.forEach(b -> b.setId(null)));
        };
    }

    @Bean
    @Order(4)
    CommandLineRunner seedReviews(ReviewRepository reviewRepository) {
        return args -> {
            if (reviewRepository.count() > 0) {
                log.info("Reviews collection already has data, skipping seed.");
                return;
            }
            seedCollection("sample-data/reviews.json", reviewRepository,
                    new TypeReference<List<Review>>() {},
                    "reviews",
                    list -> list.forEach(r -> r.setId(null)));
        };
    }

    /**
     * Generic helper: reads a JSON array from classpath, maps to list, saves via repository.
     */
    private <T> void seedCollection(
            String resourcePath,
            org.springframework.data.mongodb.repository.MongoRepository<T, String> repository,
            TypeReference<List<T>> typeRef,
            String collectionName,
            java.util.function.Consumer<List<T>> preSave) {
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            if (!resource.exists()) {
                log.warn("{} not found in resources, skipping seed for {}.", resourcePath, collectionName);
                return;
            }
            try (InputStream inputStream = resource.getInputStream()) {
                List<T> items = buildMapper().readValue(inputStream, typeRef);
                preSave.accept(items);
                repository.saveAll(items);
                log.info("✅ Seeded {} {} from sample data.", items.size(), collectionName);
            }
        } catch (Exception e) {
            log.error("Failed to seed {}: {}", collectionName, e.getMessage(), e);
        }
    }
}

