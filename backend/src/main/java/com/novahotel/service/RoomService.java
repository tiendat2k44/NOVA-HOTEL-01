package com.novahotel.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.novahotel.dto.RoomFilterRequest;
import com.novahotel.exception.BadRequestException;
import com.novahotel.exception.ResourceNotFoundException;
import com.novahotel.model.Booking;
import com.novahotel.model.Room;
import com.novahotel.repository.BookingRepository;
import com.novahotel.repository.RoomRepository;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public Page<Room> getAllRooms(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        return roomRepository.findAll(PageRequest.of(safePage, safeSize));
    }

    public List<Room> getAvailableRooms(Date checkIn, Date checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new BadRequestException("Thiếu ngày check-in hoặc check-out");
        }
        return getAvailableRooms(
                checkIn.toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                checkOut.toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
    }

    public List<Room> getAvailableRooms(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new BadRequestException("Thiếu ngày check-in hoặc check-out");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new BadRequestException("Ngày check-out phải sau ngày check-in");
        }

        return roomRepository.findAll().stream()
                .filter(room -> isRoomAvailable(room, checkIn, checkOut))
                .collect(Collectors.toList());
    }

    public Page<Room> findAvailableRooms(RoomFilterRequest filter) {
        if (filter == null) {
            throw new BadRequestException("Thiếu điều kiện tìm phòng");
        }

        List<Room> list = getAvailableRooms(filter.getCheckInDate(), filter.getCheckOutDate()).stream()
                .filter(room -> filter.getRoomType() == null || filter.getRoomType().isBlank() || filter.getRoomType().equalsIgnoreCase(room.getRoomType()))
                .filter(room -> filter.getNumberOfGuests() == null || (room.getMaxGuests() != null && room.getMaxGuests() >= filter.getNumberOfGuests()))
                .filter(room -> filter.getMinPrice() == null || getBasePrice(room) >= filter.getMinPrice())
                .filter(room -> filter.getMaxPrice() == null || getBasePrice(room) <= filter.getMaxPrice())
                .collect(Collectors.toList());

        int page = Math.max(0, filter.getPage() == null ? 0 : filter.getPage());
        int size = Math.max(1, filter.getSize() == null ? 10 : filter.getSize());
        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());
        return new PageImpl<>(list.subList(start, end), PageRequest.of(page, size), list.size());
    }

    public List<Room> getRoomsByStatus(String status) {
        return roomRepository.findByStatus(status);
    }

    public List<Room> getRoomsByType(String type) {
        return roomRepository.findByRoomType(type);
    }

    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    public Room createRoom(Room room) {
        if (room.getStatus() == null || room.getStatus().isBlank()) {
            room.setStatus("available");
        }
        return roomRepository.save(room);
    }

    public Room updateRoom(String roomId, Room payload) {
        Room existing = getRoomById(roomId);
        if (payload.getRoomId() != null) {
            existing.setRoomId(payload.getRoomId());
        }
        if (payload.getRoomNumber() != null) {
            existing.setRoomNumber(payload.getRoomNumber());
        }
        if (payload.getName() != null) {
            existing.setName(payload.getName());
        }
        if (payload.getRoomType() != null) {
            existing.setRoomType(payload.getRoomType());
        }
        if (payload.getPrice() != null) {
            existing.setPrice(payload.getPrice());
        }
        if (payload.getStatus() != null) {
            existing.setStatus(payload.getStatus());
        }
        if (payload.getFacilities() != null) {
            existing.setFacilities(payload.getFacilities());
        }
        if (payload.getImages() != null) {
            existing.setImages(payload.getImages());
        }
        if (payload.getDescription() != null) {
            existing.setDescription(payload.getDescription());
        }
        if (payload.getMaxGuests() != null) {
            existing.setMaxGuests(payload.getMaxGuests());
        }
        if (payload.getFloor() != null) {
            existing.setFloor(payload.getFloor());
        }
        return roomRepository.save(existing);
    }

    public void deleteRoom(String roomId) {
        Room existing = getRoomById(roomId);
        roomRepository.delete(existing);
    }

    public Room getRoomById(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new ResourceNotFoundException("Phòng không tìm thấy");
        }
        // Hỗ trợ lookup bằng mongo _id hoặc business key roomId (RMxxx)
        return roomRepository.findById(roomId)
                .or(() -> roomRepository.findByRoomId(roomId))
                .orElseThrow(() -> new ResourceNotFoundException("Phòng không tìm thấy"));
    }

    public boolean isRoomAvailable(Room room, LocalDate checkIn, LocalDate checkOut) {
        // Ưu tiên business key roomId (RMxxx) để khớp với dữ liệu booking mẫu và tạo mới
        String roomKey = room.getRoomId() != null ? room.getRoomId() : room.getId();
        if (roomKey == null) {
            return false;
        }

        boolean hasConflictingBooking = bookingRepository.findByRoomId(roomKey).stream()
                .filter(booking -> booking.getStatus() == null || !"CANCELLED".equalsIgnoreCase(booking.getStatus()))
                .anyMatch(booking -> overlaps(booking, checkIn, checkOut));

        return "available".equalsIgnoreCase(room.getStatus()) && !hasConflictingBooking;
    }

    private boolean overlaps(Booking booking, LocalDate checkIn, LocalDate checkOut) {
        if (booking.getCheckIn() == null || booking.getCheckOut() == null) {
            return false;
        }

        LocalDate bookingCheckIn = booking.getCheckIn().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate bookingCheckOut = booking.getCheckOut().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        return bookingCheckIn.isBefore(checkOut) && bookingCheckOut.isAfter(checkIn);
    }

    private double getBasePrice(Room room) {
        if (room.getPrice() == null || room.getPrice().getBasePrice() == null) {
            return 0.0;
        }
        return room.getPrice().getBasePrice();
    }
}