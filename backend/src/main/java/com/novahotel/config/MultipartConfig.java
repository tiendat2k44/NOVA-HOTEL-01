package com.novahotel.config;

import org.springframework.boot.servlet.MultipartConfigFactory;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

import jakarta.servlet.MultipartConfigElement;

@Configuration
public class MultipartConfig {

    private static final DataSize MAX_UPLOAD_SIZE = DataSize.ofMegabytes(50);

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(MAX_UPLOAD_SIZE);
        factory.setMaxRequestSize(MAX_UPLOAD_SIZE);
        // Optional: if you want temp files for large uploads instead of keeping in memory
        factory.setFileSizeThreshold(DataSize.ofKilobytes(256));
        return factory.createMultipartConfig();
    }

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setMaxPostSize((int) MAX_UPLOAD_SIZE.toBytes());
            connector.setProperty("maxSwallowSize", String.valueOf(-1));
        });
    }
}
