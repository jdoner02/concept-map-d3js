package edu.ewu.cscd211.conceptmap.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(@NonNull CorsRegistry registry) {
		registry.addMapping("/api/**")
				.allowedOrigins(
						"http://localhost:5173",
						"http://127.0.0.1:5173"
				)
				.allowedMethods("GET", "HEAD", "OPTIONS")
				.allowedHeaders("*")
				.exposedHeaders("Content-Type")
				.allowCredentials(false)
				.maxAge(3600);
	}
}
