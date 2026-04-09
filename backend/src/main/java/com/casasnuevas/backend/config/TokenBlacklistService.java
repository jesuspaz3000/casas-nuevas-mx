package com.casasnuevas.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private static final String PREFIX = "blacklist:";

    private final StringRedisTemplate redisTemplate;

    public void blacklistToken(String token, long expirationMs) {
        redisTemplate.opsForValue().set(
                PREFIX + token,
                "revoked",
                expirationMs,
                TimeUnit.MILLISECONDS
        );
    }

    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX + token));
    }
}
