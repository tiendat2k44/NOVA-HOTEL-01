package com.novahotel.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "reviews")
public class Review {
    @Id
    private String id;

    private String reviewId;
    private String userId;
    private String roomId;
    private int rating; // 1-5
    private String comment;
    private Date createdAt;

    public Review() {}

    public Review(String id, String reviewId, String userId, String roomId, int rating, String comment, Date createdAt) {
        this.id = id;
        this.reviewId = reviewId;
        this.userId = userId;
        this.roomId = roomId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}