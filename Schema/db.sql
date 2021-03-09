-- DB 생성
CREATE DATABASE IF NOT EXISTS paperflips;

USE paperflips;

-----------------------사용하는 DB

-- Users(유저 정보) TABLE
CREATE TABLE IF NOT EXISTS Users (
  id VARCHAR(20) NOT NULL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  password VARCHAR(88) NOT NULL,
  intro VARCHAR(300),
  favorite VARCHAR(500),
  deleted_day VARCHAR(30),
  salt VARCHAR(44)
);


CREATE TABLE IF NOT EXISTS Recipe (
   seq INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
   recipeName VARCHAR(10) NOT NULL,
   rarity VARCHAR(8) NOT NULL, 
   summary VARCHAR(30),
   path varchar(100)
);


CREATE TABLE IF NOT EXISTS Collection (
   id VARCHAR(20) NOT NULL,
   rec_num INT(11) NOT NULL,
   Date datetime NOT NULL

);


CREATE TABLE RoomInfo(
   seq INT(11) NOT NULL auto_increment primary key,
   title varchar(20) NOT NULL,
   id varchar(20) NOT NULL,
   date datetime NOT NULL,
   Data varchar(4000)
);

CREATE TABLE Recipe_Detail(
   recipeName varchar(10) NOT NULL primary key,
   detail varchar(800),
   VidPath varchar(50),
   ImgPath varchar(50)
);	  

