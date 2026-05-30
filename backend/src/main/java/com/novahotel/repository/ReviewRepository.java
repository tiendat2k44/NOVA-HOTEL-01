package com.novahotel.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.novahotel.model.Review;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByRoomId(String roomId);
    
    // Truy vấn thống kê đánh giá trung bình (sẽ dùng trong Service)
    List<Review> findByRoomIdOrderByCreatedAtDesc(String roomId);
}