const express = require('express');
const router = express.Router();

const Area = require('../models/Area');
const ParkingSpot = require('../models/ParkingSpot');

// GET all parking areas
router.get('/', async (req, res) => {
  try {
    const areas = await Area.find().sort({ createdAt: 1 });

    const areasWithStats = await Promise.all(
      areas.map(async (area) => {
        const occupiedSlots = await ParkingSpot.countDocuments({
          section: area.name,
          status: 'occupied',
        });

        const remainingSlots = Math.max(
          area.capacity - occupiedSlots,
          0
        );

        return {
          ...area.toObject(),
          occupiedSlots,
          remainingSlots,
        };
      })
    );

    res.json(areasWithStats);
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ message: 'Failed to get parking areas' });
  }
});

// CREATE parking area
router.post('/', async (req, res) => {
  try {
    const { name, location, capacity } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({
        message: 'Area name and capacity are required',
      });
    }

    const existingArea = await Area.findOne({
      name: name.trim(),
    });

    if (existingArea) {
      return res.status(400).json({
        message: 'A parking area with this name already exists',
      });
    }

    const area = await Area.create({
      name: name.trim(),
      location: location ? location.trim() : '',
      capacity: Number(capacity),
    });

    res.status(201).json(area);
  } catch (error) {
    console.error('Create area error:', error);
    res.status(500).json({ message: 'Failed to create parking area' });
  }
});

// UPDATE parking area
router.put('/:id', async (req, res) => {
  try {
    const { name, location, capacity, isActive } = req.body;

    const area = await Area.findById(req.params.id);

    if (!area) {
      return res.status(404).json({
        message: 'Parking area not found',
      });
    }

    if (name && name.trim() !== area.name) {
      const duplicate = await Area.findOne({
        name: name.trim(),
        _id: { $ne: area._id },
      });

      if (duplicate) {
        return res.status(400).json({
          message: 'A parking area with this name already exists',
        });
      }

      area.name = name.trim();
    }

    if (location !== undefined) {
      area.location = location.trim();
    }

    if (capacity !== undefined) {
      const newCapacity = Number(capacity);

      if (!Number.isFinite(newCapacity) || newCapacity < 1) {
        return res.status(400).json({
          message: 'Capacity must be at least 1',
        });
      }

      area.capacity = newCapacity;
    }

    if (isActive !== undefined) {
      area.isActive = Boolean(isActive);
    }

    await area.save();

    res.json(area);
  } catch (error) {
    console.error('Update area error:', error);
    res.status(500).json({ message: 'Failed to update parking area' });
  }
});

// DELETE parking area
router.delete('/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);

    if (!area) {
      return res.status(404).json({
        message: 'Parking area not found',
      });
    }

    const spotCount = await ParkingSpot.countDocuments({
      section: area.name,
    });

    if (spotCount > 0) {
      return res.status(400).json({
        message:
          'This area cannot be deleted because it has parking spots assigned to it',
      });
    }

    await Area.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Parking area deleted successfully',
    });
  } catch (error) {
    console.error('Delete area error:', error);
    res.status(500).json({ message: 'Failed to delete parking area' });
  }
});

module.exports = router;