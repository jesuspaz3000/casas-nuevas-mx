package com.casasnuevas.backend.user.service;

import com.casasnuevas.backend.user.dto.UserCreateDTO;
import com.casasnuevas.backend.user.dto.UserDTO;
import com.casasnuevas.backend.user.dto.UserUpdateDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserService {
    List<UserDTO> findAll();
    Page<UserDTO> findAll(Pageable pageable);
    UserDTO findById(UUID id);
    UserDTO create(UserCreateDTO dto);
    UserDTO update(UUID id, UserUpdateDTO dto);
    void toggleActive(UUID id);
    void delete(UUID id);
}
