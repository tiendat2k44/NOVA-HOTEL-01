package com.novahotel.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novahotel.model.Room;
import com.novahotel.repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.List;

/**
 * Seeds sample data on startup if collections are empty.
 * This ensures the app has data for demo without manual import every time.
 */
@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner seedRooms(RoomRepository roomRepository) {
        return args -> {
            long count = roomRepository.count();
            if (count > 0) {
                log.info("Rooms collection already has {} documents, skipping seed.", count);
                return;
            }

            try {
                ClassPathResource resource = new ClassPathResource("sample-data/rooms.json");
                if (!resource.exists()) {
                    log.warn("sample-data/rooms.json not found in resources, cannot seed rooms.");
                    return;
                }

                InputStream inputStream = resource.getInputStream();
                ObjectMapper objectMapper = new ObjectMapper();
                List<Room> rooms = objectMapper.readValue(inputStream, new TypeReference<List<Room>>() {});

                // Clear any potential issues with id
                rooms.forEach(room -> room.setId(null)); // let Mongo generate _id

                roomRepository.saveAll(rooms);
                log.info("✅ Seeded {} rooms from sample data on startup.", rooms.size());
            } catch (Exception e) {
                log.error("Failed to seed rooms: {}", e.getMessage(), e);
            }
        };
    }
}
