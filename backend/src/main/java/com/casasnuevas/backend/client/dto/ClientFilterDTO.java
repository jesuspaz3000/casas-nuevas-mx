package com.casasnuevas.backend.client.dto;

import com.casasnuevas.backend.client.model.Client;

public record ClientFilterDTO(
        String search,
        Client.ClientStatus status
) {}
