package com.novahotel.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.novahotel.model.Room;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {

    List<Room> findByStatus(String status);

    // Tìm theo loại phòng (roomType)
    List<Room> findByRoomType(String roomType);

    // Truy vấn cốt lõi 1: Tìm phòng trống theo khoảng thời gian
    @Query("{'status': 'available'}")
    List<Room> findAvailableRooms(Date checkIn, Date checkOut);
}