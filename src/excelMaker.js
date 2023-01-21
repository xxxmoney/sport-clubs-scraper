import Excel from 'exceljs';
import _ from 'lodash';

class ExcelMaker {
    

    static async saveData(data, fileName) {
        // Get the keys from the data
        const keys = _.uniq(_.flatten(_.map(data, _.keys)));

        // Create a new workbook and add a worksheet
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('My Sheet');

        // Add the keys as the column headers
        worksheet.columns = keys.map(key => ({ header: key, key }));

        // Add the data to the worksheet
        worksheet.addRows(data);

        // Save the workbook to a file
        await workbook.xlsx.writeFile(fileName);
    }

}

export { ExcelMaker }
