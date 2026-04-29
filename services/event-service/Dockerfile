FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libicu-dev \
    libonig-dev \
    zip unzip git \
    && docker-php-ext-install \
    pdo pdo_mysql mysqli intl mbstring

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy semua file project
COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data writable && \
    chmod -R 775 writable

RUN sed -i 's|/var/www/html|/var/www/html/public|g' \
    /etc/apache2/sites-available/000-default.conf

RUN a2enmod rewrite

EXPOSE 8080

ENV APACHE_RUN_USER  www-data
ENV APACHE_RUN_GROUP www-data

CMD ["apache2-foreground"]