// Function to fill the DVIC PDF form
export async function fillDVICForm(formData, updateProgress = () => {}) {
    try {
        updateProgress('Loading PDF template...', 10);
        
        // Load the PDF template
        const pdfBytes = await fetch(chrome.runtime.getURL('assets/pdf/Blank DVIC.pdf'))
            .then(res => res.arrayBuffer());
        
        updateProgress('Preparing form data...', 30);
        
        // Validate checkbox consistency
        const hasIssues = Object.entries(formData)
            .some(([key, value]) => key.match(/^\d+_[a-z]+_\d+$/) && value === true);
            
        if (formData.satisfyCond && hasIssues) {
            throw new Error('Vehicle cannot be marked as satisfactory when issues are selected.');
        }
        
        if (!formData.satisfyCond && !hasIssues) {
            throw new Error('Please select at least one issue or mark the vehicle as satisfactory.');
        }
        
        // Load the PDF document using pdf-lib
        const pdfDoc = await window.PDFLib.PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        
        // Update progress as we fill each section
        updateProgress('Filling driver information...', 40);
        
        // Fill basic information
        form.getTextField('name').setText(formData.daName);
        form.getTextField('dsp').setText(formData.dsp || '');
        form.getTextField('asset_type').setText(formData.asset_type);
        form.getTextField('vin').setText(formData.vin);
        form.getTextField('lic').setText(formData.lic);
        form.getTextField('lic_state').setText(formData.lic_state);
        form.getTextField('odo').setText(formData.odo || '');
        form.getTextField('insp_loc').setText(formData.inspLoc || ''); // Use inspLoc field directly
        form.getTextField('station').setText(formData.station || '');
        
        updateProgress('Filling inspection details...', 60);
        
        // Format date for display and filename
        const dateComponents = formData.inspDate.split('-');
        const year = dateComponents[0];
        const month = dateComponents[1];
        const day = dateComponents[2];
        
        // Format date as MM/DD/YYYY for both PDF and filename
        const formattedDate = `${month}/${day}/${year}`;
        form.getTextField('insp_date').setText(formattedDate);
        
        console.log('Processing dates:', {
            input: formData.inspDate,
            components: { year, month, day },
            formatted: formattedDate
        });
        
        // Convert 24h time to 12h format
        const timeComponents = formData.inspTime.split(':');
        let hour = parseInt(timeComponents[0]);
        const minute = timeComponents[1];
        const isAM = hour < 12;
        
        // Convert to 12-hour format
        if (hour === 0) {
            hour = 12;
        } else if (hour > 12) {
            hour -= 12;
        }
        
        // Format time as HH:MM
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute}`;
        form.getTextField('insp_time').setText(formattedTime);
        
        // Set AM/PM checkboxes (only one should be checked)
        if (isAM) {
            form.getCheckBox('insp_time_am').check();
            form.getCheckBox('insp_time_pm').uncheck();
        } else {
            form.getCheckBox('insp_time_am').uncheck();
            form.getCheckBox('insp_time_pm').check();
        }
        
        // Set inspection type (only one should be checked)
        console.log('Setting inspection type:', formData.inspectionType);
        if (formData.inspectionType.toLowerCase() === 'pre') {
            form.getCheckBox('insp_type_pre').check();
            form.getCheckBox('insp_type_post').uncheck();
        } else if (formData.inspectionType.toLowerCase() === 'post') {
            form.getCheckBox('insp_type_pre').uncheck();
            form.getCheckBox('insp_type_post').check();
        } else {
            console.error('Invalid inspection type:', formData.inspectionType);
        }
        
        updateProgress('Processing inspection items...', 80);
        
        // Fill inspection checkboxes
        Object.entries(formData).forEach(([key, value]) => {
            if (key.match(/^\d+_[a-z]+_\d+$/) && value === true) {
                const checkbox = form.getCheckBox(key);
                if (checkbox) checkbox.check();
            }
        });
        
        // Set satisfactory condition checkbox based on popup state
        console.log('Setting satisfactory condition:', formData.satisfyCond);
        const satisfyCheckbox = form.getCheckBox('satisfy_cond');
        if (formData.satisfyCond) {
            satisfyCheckbox.check();
        } else {
            satisfyCheckbox.uncheck();
        }
        
        // Add signature (same as driver name)
        form.getTextField('signature').setText(formData.daName);
        
        updateProgress('Finalizing PDF...', 90);
        
        // Save the filled PDF
        const filledPdfBytes = await pdfDoc.save();
        
        // Convert to Blob and create download URL
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Format filename with same date format as PDF
        const filename = `${formData.daName.replace(/[^a-zA-Z0-9]/g, '_')}_${formData.inspectionType}_DVIC_${formattedDate.replace(/\//g, '-')}.pdf`;
        
        console.log('Generated filename:', filename);
        
        updateProgress('Complete!', 100);
        
        return {
            success: true,
            url: url,
            filename: filename,
            blob: blob // Return blob for optional save-as dialog
        };
    } catch (error) {
        console.error('Error filling PDF:', error);
        throw error;
    }
}
