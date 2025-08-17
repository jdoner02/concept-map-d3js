package edu.ewu.cscd211.conceptmap;

import edu.ewu.cscd211.conceptmap.config.CorsConfig;
import edu.ewu.cscd211.conceptmap.service.ConceptMapService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConceptMapController.class)
@Import(CorsConfig.class)
class ConceptMapCorsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConceptMapService conceptMapService;

    @Test
    void preflightFromAllowedOriginShouldIncludeCorsHeaders() throws Exception {
        // Mock the service methods
        when(conceptMapService.getConceptMapJson()).thenReturn("{\"test\": \"data\"}");
        when(conceptMapService.isValidJson("{\"test\": \"data\"}")).thenReturn(true);
        
        mockMvc.perform(
                options("/api/concept-map")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "X-Test-Header")
        )
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("GET")))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("HEAD")))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("OPTIONS")))
                .andExpect(header().string("Access-Control-Max-Age", "3600"))
                // With allowedHeaders("*"), Spring echoes requested headers
                .andExpect(header().string("Access-Control-Allow-Headers", containsString("X-Test-Header")))
                // Credentials disabled -> header absent
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
        void preflightFromDisallowedOriginShouldBeRejectedWith403() throws Exception {
        mockMvc.perform(
                options("/api/concept-map")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET")
        )
                                .andExpect(status().isForbidden())
                                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void actualGetFromAllowedOriginShouldIncludeAllowOrigin() throws Exception {
        // Mock the service methods
        when(conceptMapService.getConceptMapJson()).thenReturn("{\"test\": \"data\"}");
        when(conceptMapService.isValidJson("{\"test\": \"data\"}")).thenReturn(true);
        
        mockMvc.perform(
                get("/api/concept-map")
                        .header("Origin", "http://localhost:5173")
        )
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Content-Type", "application/json"));
    }
}
