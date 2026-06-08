package com.novahotel.model;

import java.util.List;
import java.util.Objects;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
@Document(collection = "rooms")
public class Room {
    @Id
    private String id;

    private String roomId;
    private String roomNumber;
    private String name;
    private String roomType;
    private Price price;
    private String status;
    private List<String> facilities;
    private List<String> images;
    private String description;
    private Integer maxGuests;
    private Integer floor;

    public Room() {}

    public Room(String id, String roomId, String roomNumber, String name, String roomType, Price price, String status, List<String> facilities, List<String> images, String description, Integer maxGuests, Integer floor) {
        this.id = id;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.name = name;
        this.roomType = roomType;
        this.price = price;
        this.status = status;
        this.facilities = facilities;
        this.images = images;
        this.description = description;
        this.maxGuests = maxGuests;
        this.floor = floor;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public Price getPrice() { return price; }
    public void setPrice(Price price) { this.price = price; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getFacilities() { return facilities; }
    public void setFacilities(List<String> facilities) { this.facilities = facilities; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getMaxGuests() { return maxGuests; }
    public void setMaxGuests(Integer maxGuests) { this.maxGuests = maxGuests; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    // Inner classes
    public static class Price {
        private Double basePrice;
        private SeasonalPrice seasonalPrice;

        public Price() {}
        public Price(Double basePrice, SeasonalPrice seasonalPrice) { this.basePrice = basePrice; this.seasonalPrice = seasonalPrice; }
        public Double getBasePrice() { return basePrice; }
        public void setBasePrice(Double basePrice) { this.basePrice = basePrice; }
        public SeasonalPrice getSeasonalPrice() { return seasonalPrice; }
        public void setSeasonalPrice(SeasonalPrice seasonalPrice) { this.seasonalPrice = seasonalPrice; }
    }

    public static class SeasonalPrice {
        private Double highSeason;
        private Double lowSeason;

        public SeasonalPrice() {}
        public SeasonalPrice(Double highSeason, Double lowSeason) { this.highSeason = highSeason; this.lowSeason = lowSeason; }
        public Double getHighSeason() { return highSeason; }
        public void setHighSeason(Double highSeason) { this.highSeason = highSeason; }
        public Double getLowSeason() { return lowSeason; }
        public void setLowSeason(Double lowSeason) { this.lowSeason = lowSeason; }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Room room = (Room) o;
        return Objects.equals(id, room.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

}
