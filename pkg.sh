#!/bin/bash

yarn build
tar -czf build.tar.gz dist prisma src/client