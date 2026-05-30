package com.novahotel.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.novahotel.model.Booking;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserId(String userId);
    List<Booking> findByRoomId(String roomId);
    
    // Truy vấn cốt lõi 3: Xem lịch sử đặt phòng của khách
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
}