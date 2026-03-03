import openpyxl

file_path = r'f:\for PORTFOLIO\Project_PokemonV3\Updated_PokeTables.xlsx'
wb = openpyxl.load_workbook(file_path)
ws = wb['Consolidated (V1 & V2)']

# Formula we want to set:
# =IFERROR(_xlfn.XLOOKUP(D2, Move_List!$A:$A, Move_List!$D:$D) * IF(_xlfn.XLOOKUP(D2, Move_List!$A:$A, Move_List!$C:$C)="Physical", K2, IF(_xlfn.XLOOKUP(D2, Move_List!$A:$A, Move_List!$C:$C)="Special", I2, 0)), "")

for row in range(2, ws.max_row + 1):
    d_val = ws[f'D{row}'].value
    if d_val is not None:
        # Note: we use _xlfn.XLOOKUP so openpyxl writes it correctly for Excel
        formula = f'=IFERROR(_xlfn.XLOOKUP(D{row}, Move_List!$A:$A, Move_List!$D:$D) * IF(_xlfn.XLOOKUP(D{row}, Move_List!$A:$A, Move_List!$C:$C)="Physical", K{row}, IF(_xlfn.XLOOKUP(D{row}, Move_List!$A:$A, Move_List!$C:$C)="Special", I{row}, 0)), "")'
        ws[f'N{row}'] = formula

wb.save(file_path)
print(f"Updated {ws.max_row - 1} rows with the new formula.")
