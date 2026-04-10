package com.casasnuevas.backend.user.service.Impl;

import com.casasnuevas.backend.common.exception.ResourceNotFoundException;
import com.casasnuevas.backend.user.dto.UserCreateDTO;
import com.casasnuevas.backend.user.dto.UserDTO;
import com.casasnuevas.backend.user.dto.UserUpdateDTO;
import com.casasnuevas.backend.user.model.User;
import com.casasnuevas.backend.user.repository.UserRepository;
import com.casasnuevas.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserDTO> findAll() {
        return userRepository.findByIsActiveTrue().stream().map(this::toDTO).toList();
    }

    @Override
    public List<UserDTO> findAll(String search) {
        if (search == null || search.isBlank()) return findAll();
        return userRepository.searchActive(search.trim()).stream().map(this::toDTO).toList();
    }

    @Override
    public Page<UserDTO> findAll(Pageable pageable) {
        return userRepository.findByIsActiveTrue(pageable).map(this::toDTO);
    }

    @Override
    public Page<UserDTO> findAll(Pageable pageable, String search) {
        if (search == null || search.isBlank()) return findAll(pageable);
        return userRepository.searchActive(search.trim(), pageable).map(this::toDTO);
    }

    @Override
    public UserDTO findById(UUID id) {
        return toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public UserDTO create(UserCreateDTO dto) {
        User user = User.builder()
                .name(dto.name())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .role(dto.role())
                .isActive(true)
                .build();
        return toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserDTO update(UUID id, UserUpdateDTO dto) {
        User user = getOrThrow(id);
        if (dto.name() != null)     user.setName(dto.name());
        if (dto.email() != null)    user.setEmail(dto.email());
        if (dto.password() != null) user.setPassword(passwordEncoder.encode(dto.password()));
        if (dto.role() != null)     user.setRole(dto.role());
        return toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public void toggleActive(UUID id) {
        User user = getOrThrow(id);
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User user = getOrThrow(id);
        user.setActive(false);
        userRepository.save(user);
    }

    private User getOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    private UserDTO toDTO(User u) {
        return new UserDTO(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt());
    }
}
