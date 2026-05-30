package com.novahotel.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Objects;

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
    private int maxGuests;

    public Room() {}

    public Room(String id, String roomId, String roomNumber, String name, String roomType, Price price, String status, List<String> facilities, List<String> images, String description, int maxGuests) {
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

    public int getMaxGuests() { return maxGuests; }
    public void setMaxGuests(int maxGuests) { this.maxGuests = maxGuests; }

    // Inner classes
    public static class Price {
        private double basePrice;
        private SeasonalPrice seasonalPrice;

        public Price() {}
        public Price(double basePrice, SeasonalPrice seasonalPrice) { this.basePrice = basePrice; this.seasonalPrice = seasonalPrice; }
        public double getBasePrice() { return basePrice; }
        public void setBasePrice(double basePrice) { this.basePrice = basePrice; }
        public SeasonalPrice getSeasonalPrice() { return seasonalPrice; }
        public void setSeasonalPrice(SeasonalPrice seasonalPrice) { this.seasonalPrice = seasonalPrice; }
    }

    public static class SeasonalPrice {
        private double highSeason;
        private double lowSeason;

        public SeasonalPrice() {}
        public SeasonalPrice(double highSeason, double lowSeason) { this.highSeason = highSeason; this.lowSeason = lowSeason; }
        public double getHighSeason() { return highSeason; }
        public void setHighSeason(double highSeason) { this.highSeason = highSeason; }
        public double getLowSeason() { return lowSeason; }
        public void setLowSeason(double lowSeason) { this.lowSeason = lowSeason; }
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
